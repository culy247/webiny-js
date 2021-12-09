const { handler } = require("./handler.original.js");
const https = require("https");
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

async function postTelemetryData(telemetryData) {
    return new Promise((resolve, reject) => {
        const options = {
            method: "POST",
            hostname: "dprxy5obcl14c.cloudfront.net",
            path: "/telemetry",
            headers: { "Content-Type": "application/json" },
            maxRedirects: 20
        };

        const req = https.request(options, function (res) {
            const chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                const body = Buffer.concat(chunks);
                resolve(body.toString());
            });

            res.on("error", function (error) {
                reject(error);
            });
        });

        const postData = JSON.stringify(telemetryData);

        req.write(postData);

        req.end();
    });
}


const localData = {
    apiKey: process.env.WCP_API_KEY,
    version: process.env.WCP_TELEMETRY_VERSION,
    logs: []
};

let timerRunning = false;

const initialTime = new Date();
const minutesToFireRequest = 5;

async function initTelemetry() {
    if (timerRunning) {
        return;
    }

    timerRunning = true;

    setInterval(async () => {
        if (initialTime > new Date(initialTime.getTime() + minutesToFireRequest * 60000)) {
            if (localData.logs.length > 0) {
                await postTelemetryData(localData);
            }
        }
    }, 1000);
}

async function addToTelemetryPackage(data) {
    localData.logs.push(data);

    if (localData.logs.length === 1000) {
        await postTelemetryData(localData);
        localData.logs = [];
    }
}

module.exports.handler = async (args) => {
    await initTelemetry();
    const start = Date.now();

    try {
        const result = await handler(args);

        const duration = Date.now() - start;

        await addToTelemetryPackage({
            error: false,
            executionDuration: duration,
            functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            createdOn: Date.now()
        });

        return result;
    } catch (error) {
        const duration = Date.now() - start;

        await addToTelemetryPackage({
            error: true,
            executionDuration: duration,
            functionName: process.env.WCP_TELEMETRY_FUNCTION_NAME,
            createdOn: Date.now()
        });
    }
};