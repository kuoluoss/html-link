export default {
	async fetch(request, env) {
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization"
		};

		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: corsHeaders
			});
		}

		const url = new URL(request.url);

		if (request.method === "GET" && url.pathname === "/") {
			return jsonResponse({
				ok: true,
				message: "Worker is running",
				path: url.pathname
			}, 200, corsHeaders);
		}

		if (request.method === "POST" && url.pathname === "/qa-keywords") {
			return handleQAKeywords(request, env, corsHeaders);
		}

		if (url.pathname !== "/chat") {
			return jsonResponse({
				error: "Not found",
				path: url.pathname
			}, 404, corsHeaders);
		}

		if (request.method !== "POST") {
			return jsonResponse({
				error: "Only POST is allowed"
			}, 405, corsHeaders);
		}

		try {
			const body = await request.json();

			const message = String(body.message || "").trim();
			const history = Array.isArray(body.history) ? body.history : [];
			const relatedQA = Array.isArray(body.relatedQA) ? body.relatedQA : [];
			const attachments = Array.isArray(body.attachments) ? body.attachments : [];

			if (!message && attachments.length === 0) {
				return jsonResponse({
					reply: "请先输入问题，或者上传日志/截图。"
				}, 200, corsHeaders);
			}

			// ============================================================
			// 关键改动 1：
			// 如果用户没有上传附件，并且站内问答库有高置信度命中，
			// 直接返回问答库答案，不调用 AI。
			// 这样可以避免“问答库有正确答案，但 AI 自己发挥”。
			// ============================================================

			const directQA = findBestDirectQA(message, relatedQA);

			if (directQA && attachments.length === 0) {
				return jsonResponse({
					reply: formatDirectQAReply(directQA)
				}, 200, corsHeaders);
			}

			const apiKey = env.OPENAI_API_KEY;
			const baseUrl = env.OPENAI_BASE_URL || "https://api.siliconflow.cn/v1";
			const model = env.OPENAI_MODEL || "Qwen/Qwen2.5-7B-Instruct";

			if (!apiKey) {
				return jsonResponse({
					reply: "Worker 未配置 OPENAI_API_KEY，请先在 Cloudflare Worker 环境变量里添加 OPENAI_API_KEY。"
				}, 200, corsHeaders);
			}

			const openaiMessages = buildMessages({
				message,
				history,
				relatedQA,
				attachments
			});

			const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
				method: "POST",
				headers: {
					"Authorization": `Bearer ${apiKey}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					model,
					messages: openaiMessages,

					// 关键改动 2：
					// 降低随机性，让它更听知识库。
					temperature: 0.15,

					max_tokens: 1600
				})
			});

			const aiText = await aiResponse.text();

			if (!aiResponse.ok) {
				return jsonResponse({
					reply:
						"AI 接口请求失败。\n\n" +
						`HTTP 状态码：${aiResponse.status}\n\n` +
						"请检查：\n" +
						"1. OPENAI_API_KEY 是否正确；\n" +
						"2. OPENAI_BASE_URL 是否为 https://api.siliconflow.cn/v1；\n" +
						"3. OPENAI_MODEL 是否是 SiliconFlow 支持的模型 ID；\n" +
						"4. 当前模型是否支持图片输入。\n\n" +
						`接口返回：${aiText.slice(0, 1200)}`
				}, 200, corsHeaders);
			}

			let aiData;

			try {
				aiData = JSON.parse(aiText);
			} catch (e) {
				return jsonResponse({
					reply: "AI 接口返回的不是合法 JSON：\n\n" + aiText.slice(0, 1200)
				}, 200, corsHeaders);
			}

			const reply =
				aiData &&
				aiData.choices &&
				aiData.choices[0] &&
				aiData.choices[0].message &&
				aiData.choices[0].message.content
					? aiData.choices[0].message.content
					: "AI 没有返回有效内容。";

			return jsonResponse({
				reply
			}, 200, corsHeaders);

		} catch (error) {
			return jsonResponse({
				reply:
					"Worker 处理请求时出错。\n\n" +
					`错误信息：${error.message || String(error)}`
			}, 200, corsHeaders);
		}
	}
};

async function handleQAKeywords(request, env, corsHeaders) {
	const expectedSecret = env.AI_ADMIN_SECRET;
	const authorization = request.headers.get("Authorization") || "";
	const token = authorization.replace(/^Bearer\s+/i, "").trim();

	if (!expectedSecret || token !== expectedSecret) {
		return jsonResponse({
			ok: false,
			error: "Unauthorized"
		}, 401, corsHeaders);
	}

	const apiKey = env.OPENAI_API_KEY;
	const baseUrl = env.OPENAI_BASE_URL || "https://api.siliconflow.cn/v1";
	const model = env.OPENAI_MODEL || "Qwen/Qwen2.5-7B-Instruct";

	if (!apiKey) {
		return jsonResponse({
			ok: false,
			error: "Worker 未配置 OPENAI_API_KEY。"
		}, 500, corsHeaders);
	}

	const body = await request.json();
	const category = String(body.category || "").slice(0, 80);
	const question = String(body.question || "").slice(0, 300);
	const answer = String(body.answer || "").slice(0, 8000);
	const existingKeywords = Array.isArray(body.existingKeywords) ? body.existingKeywords.slice(0, 80) : [];
	const referenceKeywords = Array.isArray(body.referenceKeywords) ? body.referenceKeywords.slice(0, 120) : [];

	const prompt = `请根据下面的 Minecraft 整合包 QA 内容生成更完整的搜索关键词。\n\n分类：${category}\n问题：${question}\n答案：${answer}\n当前这条已有关键词：${existingKeywords.join("、")}\n全站已有关键词参考：${referenceKeywords.join("、")}\n\n要求：\n1. 只返回 JSON，不要解释。\n2. JSON 格式必须是 {"keywords":["关键词1","关键词2"]}。\n3. 生成 18 到 30 个中文搜索友好的关键词，当前这条已有关键词可以保留并补充。\n4. 优先参考“全站已有关键词参考”的写法、长度、命名风格和覆盖角度，但不要无关照抄。\n5. 必须覆盖：核心问题词、玩家常用短词、同义词、简称、中文名/英文名、工具名、模组名、版本词、报错关键词、常见错误描述。\n6. 关键词要短，适合搜索框匹配，例如“启动失败”“崩溃”“PCL2”“Java17”“显卡驱动”。\n7. 不要完整句子，不要 URL，不要重复，不要无意义泛词。`;

	const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${apiKey}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			model,
			messages: [
				{
					role: "system",
					content: "你是关键词生成器，只输出严格 JSON。"
				},
				{
					role: "user",
					content: prompt
				}
			],
			temperature: 0.1,
			max_tokens: 1000
		})
	});
	const aiText = await aiResponse.text();

	if (!aiResponse.ok) {
		return jsonResponse({
			ok: false,
			error: `AI 请求失败：HTTP ${aiResponse.status}`,
			detail: aiText.slice(0, 800)
		}, 502, corsHeaders);
	}

	let aiData;
	try {
		aiData = JSON.parse(aiText);
	} catch (error) {
		return jsonResponse({
			ok: false,
			error: "AI 返回不是合法 JSON。",
			detail: aiText.slice(0, 800)
		}, 502, corsHeaders);
	}

	const content = aiData && aiData.choices && aiData.choices[0] && aiData.choices[0].message
		? aiData.choices[0].message.content
		: "";
	const keywords = extractKeywords(content);

	return jsonResponse({
		ok: true,
		keywords
	}, 200, corsHeaders);
}

function extractKeywords(content) {
	const text = String(content || "").trim();
	let parsed = null;

	try {
		parsed = JSON.parse(text);
	} catch (error) {
		const match = text.match(/\{[\s\S]*\}/);
		if (match) {
			try {
				parsed = JSON.parse(match[0]);
			} catch (innerError) {
				parsed = null;
			}
		}
	}

	const raw = parsed && Array.isArray(parsed.keywords) ? parsed.keywords : [];
	const seen = new Set();
	const result = [];

	for (const item of raw) {
		const keyword = String(item || "").trim().slice(0, 60);
		const key = keyword.toLowerCase();

		if (!keyword || seen.has(key) || /^https?:\/\//i.test(keyword)) continue;

		seen.add(key);
		result.push(keyword);
	}

	return result.slice(0, 30);
}

function buildMessages({ message, history, relatedQA, attachments }) {
	const systemPrompt = `
你是“你好，新蒸程”Minecraft 整合包的 AI 问题诊断助手。

最高优先级规则，必须严格遵守：

1. 站内问答库是最高优先级资料。
2. 如果站内问答库中有和用户问题明显相关或直接对应的内容，必须优先按照问答库回答。
3. 不允许编造和问答库冲突的答案。
4. 不允许在问答库已有明确答案时，改用你自己的常识、模型记忆或外部知识回答。
5. 如果问答库答案已经能解决问题，请直接复述并整理问答库答案，可以适当简化，但不能改变含义。
6. 只有当问答库没有相关内容、用户上传日志/截图需要分析、或者信息明显不足时，才允许你根据日志和常识补充排查建议。
7. 如果你补充了问答库之外的建议，必须说明“补充排查建议”。
8. 如果回答的内容问答库含有参考视频这类的链接，那么这个链接必须优先提供提供给用户，放在回复消息的最前面
9. 你需要判断用户是否在闲聊，如果是闲聊可以一定程度上闲聊，但是要记住你主要任务是解决用户的问题，所有闲聊几句后要提醒用户

你的任务：
1. 帮用户排查整合包安装、启动、崩溃、卡顿、联机、服务器、模组、光影、VOXY、PCL2、Java、显卡驱动等问题。
2. 如果用户上传了日志，请优先分析日志中的 Error、Exception、Caused by、Mod loading、Mixin、Java、OpenGL、显卡、内存相关信息。
3. 如果信息不足，要明确告诉用户还需要补充什么，例如 latest.log、crash-report、整合包版本、启动器、Java版本、显卡型号等。
4. 回答要用中文，尽量直接、具体、可操作。
5. 不要假装看到了不存在的内容。
6. 如果能判断原因，请按照“原因 / 解决方法 / 还需要补充”的结构回答。
`;

	const messages = [
		{
			role: "system",
			content: systemPrompt
		}
	];

	const safeHistory = history
		.slice(-6)
		.filter(item => item && typeof item.content === "string")
		.map(item => ({
			role: item.role === "assistant" ? "assistant" : "user",
			content: item.content.slice(0, 3000)
		}));

	for (const item of safeHistory) {
		messages.push(item);
	}

	const promptText = buildUserPrompt(message, relatedQA, attachments);

	const hasImages = attachments.some(file => file && file.type === "image" && file.content);

	if (hasImages) {
		const userContent = [];

		userContent.push({
			type: "text",
			text: promptText
		});

		for (const file of attachments) {
			if (!file || file.type !== "image") continue;
			if (!file.content) continue;

			const imageUrl = normalizeImageDataUrl(file.content, file.mime);

			if (!imageUrl) continue;

			userContent.push({
				type: "image_url",
				image_url: {
					url: imageUrl
				}
			});
		}

		messages.push({
			role: "user",
			content: userContent
		});
	} else {
		messages.push({
			role: "user",
			content: promptText
		});
	}

	return messages;
}

function buildUserPrompt(message, relatedQA, attachments) {
	let prompt = "";

	prompt += `用户当前问题：\n${message || "用户没有输入文字，只上传了附件，请根据附件分析。"}\n\n`;

	const imageFiles = attachments.filter(file => file && file.type === "image");
	const textFiles = attachments.filter(file => file && file.type === "text");

	if (imageFiles.length > 0) {
		prompt += `用户上传了 ${imageFiles.length} 张图片/截图。如果当前模型支持图片，请读取图片内容。如果模型不支持图片，请提醒用户上传文字日志。\n\n`;
		prompt += `图片文件名：\n`;

		for (const file of imageFiles) {
			prompt += `- ${file.name || "未命名图片"}\n`;
		}

		prompt += `\n`;
	}

	if (textFiles.length > 0) {
		prompt += `用户上传了 ${textFiles.length} 个日志/文本文件。请优先分析这些日志。\n\n`;

		for (const file of textFiles) {
			const name = file.name || "未命名日志";
			const content = String(file.content || "").slice(0, 40000);

			prompt += `================ 日志文件开始 ================\n`;
			prompt += `文件名：${name}\n`;
			prompt += `内容：\n${content}\n`;
			prompt += `================ 日志文件结束 ================\n\n`;
		}
	}

	if (relatedQA.length > 0) {
		prompt += `下面是站内问答库中检索到的相关问答。\n`;
		prompt += `注意：这些内容优先级高于你的模型知识。只要其中有直接相关答案，你必须优先按照问答库回答，不要自行改写成相反意思。\n\n`;

		for (const item of relatedQA.slice(0, 6)) {
			prompt += `分类：${item.category || "未分类"}\n`;
			prompt += `问题：${item.question || ""}\n`;
			prompt += `答案：${item.answer || ""}\n`;

			if (Array.isArray(item.keywords) && item.keywords.length > 0) {
				prompt += `关键词：${item.keywords.join("、")}\n`;
			}

			prompt += `\n`;
		}
	} else {
		prompt += `站内问答库没有检索到明显相关内容，可以根据日志、截图和常规排查经验回答。\n\n`;
	}

	prompt += `
请根据以上信息进行诊断。

回答要求：
1. 如果问答库有直接答案，开头写：“根据站内问答库：”
2. 如果问答库没有直接答案，但有部分相关内容，开头写：“问答库中没有完全对应的问题，但有相关参考：”
3. 如果完全没有问答库依据，开头写：“问答库中没有找到对应答案，下面是补充排查建议：”
4. 先直接判断最可能原因。
5. 再给出具体解决步骤。
6. 如果缺少关键信息，请明确要求用户补充。
7. 如果截图或日志里有明确报错，请引用关键报错文字并解释。
`;

	return prompt;
}

// =====================================================================
// 问答库直接命中逻辑
// =====================================================================

function findBestDirectQA(message, relatedQA) {
	if (!message || !Array.isArray(relatedQA) || relatedQA.length === 0) {
		return null;
	}

	const input = normalizeText(message);
	const inputTokens = splitToTokens(message);

	let best = null;
	let bestScore = 0;

	for (const item of relatedQA.slice(0, 8)) {
		if (!item) continue;

		const question = String(item.question || "");
		const answer = String(item.answer || "");
		const category = String(item.category || "");
		const keywords = Array.isArray(item.keywords) ? item.keywords : [];

		if (!question || !answer) continue;

		const normalizedQuestion = normalizeText(question);
		const normalizedAnswer = normalizeText(answer);
		const normalizedCategory = normalizeText(category);
		const normalizedKeywords = keywords.map(k => normalizeText(k)).filter(Boolean);

		let score = 0;

		// 1. 用户问题和问答库问题高度包含，直接高分。
		if (input && normalizedQuestion.includes(input)) {
			score += 120;
		}

		if (input && input.includes(normalizedQuestion)) {
			score += 120;
		}

		// 2. 去掉常见疑问词后再匹配。
		const simplifiedInput = removeQuestionWords(input);
		const simplifiedQuestion = removeQuestionWords(normalizedQuestion);

		if (simplifiedInput && simplifiedQuestion) {
			if (simplifiedQuestion.includes(simplifiedInput)) {
				score += 90;
			}

			if (simplifiedInput.includes(simplifiedQuestion)) {
				score += 90;
			}
		}

		// 3. 关键词命中。
		for (const keyword of normalizedKeywords) {
			if (!keyword) continue;

			if (input.includes(keyword)) {
				score += keyword.length >= 4 ? 24 : 14;
			}
		}

		// 4. 分词命中问题标题。
		for (const token of inputTokens) {
			const t = normalizeText(token);

			if (t.length < 2) continue;

			if (normalizedQuestion.includes(t)) {
				score += Math.min(t.length * 4, 24);
			}

			if (normalizedAnswer.includes(t)) {
				score += Math.min(t.length * 2, 12);
			}

			if (normalizedCategory.includes(t)) {
				score += 8;
			}
		}

		// 5. 常见短问题增强。
		if (isShortDirectQuestion(message)) {
			for (const keyword of normalizedKeywords) {
				if (input.includes(keyword)) {
					score += 25;
				}
			}
		}

		if (score > bestScore) {
			bestScore = score;
			best = item;
		}
	}

	// 阈值说明：
	// 80 以上基本认为是直接命中。
	// 如果你的问答库匹配仍不够积极，可以把 80 改成 60。
	if (best && bestScore >= 80) {
		return {
			...best,
			_score: bestScore
		};
	}

	return null;
}

function formatDirectQAReply(item) {
	const category = item.category || "未分类";
	const question = item.question || "";
	const answer = item.answer || "";

	let reply = "";

	reply += `根据站内问答库，已找到直接对应的问题：\n\n`;

	if (category) {
		reply += `分类：${category}\n`;
	}

	if (question) {
		reply += `问题：${question}\n\n`;
	}

	reply += `${answer}`;

	return reply;
}

function normalizeText(value) {
	return String(value || "")
		.toLowerCase()
		.replace(/\s+/g, "")
		.replace(/[，。！？、,.!?;；:：()（）[\]【】"'“”‘’《》<>]/g, "");
}

function removeQuestionWords(value) {
	return String(value || "")
		.replace(/为什么/g, "")
		.replace(/怎么/g, "")
		.replace(/怎么办/g, "")
		.replace(/如何/g, "")
		.replace(/能不能/g, "")
		.replace(/可以吗/g, "")
		.replace(/是什么/g, "")
		.replace(/在哪/g, "")
		.replace(/哪里/g, "")
		.replace(/吗/g, "")
		.replace(/呢/g, "");
}

function splitToTokens(value) {
	return String(value || "")
		.replace(/[，。！？、,.!?;；:：()（）[\]【】"'“”‘’《》<>]/g, " ")
		.split(/\s+/)
		.map(item => item.trim())
		.filter(Boolean);
}

function isShortDirectQuestion(value) {
	const text = String(value || "").trim();

	if (!text) return false;

	return text.length <= 30;
}

// =====================================================================
// 图片处理
// =====================================================================

function normalizeImageDataUrl(content, mime) {
	const value = String(content || "");

	if (!value) return "";

	if (value.startsWith("data:image/")) {
		return value;
	}

	const safeMime = mime && String(mime).startsWith("image/")
		? String(mime)
		: "image/png";

	return `data:${safeMime};base64,${value}`;
}

function jsonResponse(data, status, corsHeaders) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			...corsHeaders,
			"Content-Type": "application/json; charset=utf-8"
		}
	});
}
