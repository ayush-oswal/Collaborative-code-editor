import { createClient } from "redis";
import axios from "axios";
import dotenv from "dotenv";


dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL
});


async function processSubmission(submission: string) {
    const { roomId, code, language } = JSON.parse(submission);
    console.log(roomId, code, language);

    const judge0Url = 'https://judge0.p.rapidapi.com/submissions?fields=*&base64_encoded=false&wait=true'
    const judge0Key = process.env.X_RAPID_API_KEY || ""

    const payload = {
        source_code: code,
        language_id: getLanguageId(language),
    };

    try {
        const response = await axios.post(judge0Url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
                'x-rapidapi-key': judge0Key,
            },
        });

        if (!response.data || !response.data.status || response.data.status.id <= 2) {
            throw new Error(`Judge0 API responded with status ${response.data.status}`);
        }

        let result = response.data;

        if (result.status.id <= 2) {
            //means still processing
            result = await pollJudge0Result(result.token, judge0Key);
        }

        await redisClient.publish(roomId, JSON.stringify(result));
        console.log(`Published result to room: ${roomId}`);
    } catch (error) {
        console.error(`Error processing submission for room: ${roomId}`, error);
        await redisClient.publish(roomId,"error");
    }
}

async function pollJudge0Result(token: string, apiKey: string) {
    const judge0ResultUrl = `https://judge0.p.rapidapi.com/submissions/${token}?base64_encoded=false`;

    while (true) {
        try {
            const response = await axios.get(judge0ResultUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
                    'x-rapidapi-key': apiKey,
                },
            });

            if (!response.data || !response.data.status) {
                throw new Error(`Invalid response from Judge0 API`);
            }

            const resultData = response.data;
            
            if (resultData.status.id > 2) {
                //i.e result is processed
                return resultData;
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000)); 
            }
        } catch (error) {
            console.error(`Error polling Judge0 API for token ${token}`, error);
            await new Promise(resolve => setTimeout(resolve, 2000)); 
        }
    }
}

async function startWorker() {
    try {
        await redisClient.connect();
        console.log("Worker connected to Redis.");

        while (true) {
            try {
                const data = await redisClient.brPop("submissions", 0);
                if (data) {
                    await processSubmission(data.element);
                }
            } catch (err) {
                console.error("Error processing submission:", err);
            }
        }
    } catch (err) {
        console.log(err);
    }
}

function getLanguageId(language: string): number {
    const languageMap: { [key: string]: number } = {
        "javascript": 63,
        "python": 71,
        "cpp": 54,
        "java": 62
    };
    return languageMap[language.toLowerCase()];
}

startWorker().catch(console.error);
