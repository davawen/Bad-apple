import * as getPixels from "image-pixels";
import * as fs from "fs";

import { spawn } from 'child_process';

import { Client, Message, TextChannel } from 'discord.js';

import * as dotenv from 'dotenv';
dotenv.config();
let tokens =
	[
		process.env.DISCORD_TOKEN1,
		process.env.DISCORD_TOKEN2,
		process.env.DISCORD_TOKEN3,
		process.env.DISCORD_TOKEN4,
		process.env.DISCORD_TOKEN5,
		process.env.DISCORD_TOKEN6,
		process.env.DISCORD_TOKEN7,
		process.env.DISCORD_TOKEN8,
		process.env.DISCORD_TOKEN9,
		process.env.DISCORD_TOKEN10
	];

async function sleep(time: number)
{
	return new Promise(resolve => setTimeout(resolve, time));
}

async function main()
{
	type PixelData = {data: Uint8Array, width: number, height: number};
	
	let frames: string[] = [];

	//Create string from pixels
	for(let i = 0; i < 6572; i++) //6572
	{
		let pixelData: PixelData = await getPixels(`./ResizedFrames/out-${i + 1}.png`);
		
		// let pixels = "";
		// let pixels = fs.readFileSync(`${__dirname}/FramesCompressed/out-${index+1}.txt`, {encoding: 'ascii'});
		
		let mes = "\`";
		
		for(let j = 0; j < pixelData.data.length; j += 4)
		{
			// console.log(`r${pixelData.data[i]}, g${pixelData.data[i+1]}, b${pixelData.data[i+2]}\n`);

			let value =  pixelData.data[j] < 15  ? "⬛" :
						(pixelData.data[j] > 240 ? "⬜" :
						(pixelData.data[j] < 128 ? "🔳" : "🔲"));
			
			// pixels += value;
						
			mes += value;
			
			if(Math.floor(j/4) % 51 == 50) mes += "\n";
		}
		
		// fs.writeFileSync(`${__dirname}/FramesCompressed/out-${index+1}.txt`, pixels, {encoding: 'ascii'});
		
		frames.push(mes + "\`");
		
		if(i % 200 == 0) console.log(i / 6572 * 100 + "%"); //Only regularly update progress bar
	}
	
	console.log("\nStarting Bots !");

	let clients: Client[] = [];

	for(let i = 0; i < 10; i++)
	{
		clients.push(new Client());

		let token = tokens[i % tokens.length];

		clients[i].login(token);
	}

	let frameIndex = 0;

	clients.forEach(
		(client, index) =>
		{
			client.on('message',
				async (message) =>
				{
					if(message.content.startsWith("!bad apple"))
					{
						await sleep(index * 180);

						while(frameIndex < frames.length)
						{
							message.channel.send(frames[Math.floor(frameIndex)]);
							
							frameIndex += 6; //Corrects framerate to run at real time
							
							await sleep(clients.length * 200); //With 10 bots, provide 2000ms of downtime, just barely enough not to lag
						}
						
						if(index == clients.length-1) //If your the last bot, clean up everything
						{
							fs.rmSync(`${__dirname}/../ResizedFrames`, { recursive: true, force: true }); //Remove frames
							
							process.exit(0); //Exit program
						}
					}
				}
			);

			client.on('ready', () => console.log(`Logged in as ${client.user.username}, I am bot number ${index} !`));
		}
	);
}

//ffmpeg -i bad_apple.mp4 -vf scale="51x36" "ResizedFrames/out-%d.png"
if(!fs.existsSync(`${__dirname}/../ResizedFrames`))
{
	fs.mkdirSync(`${__dirname}/../ResizedFrames`);
}

//Run ffmpeg on video, then launch program

let __ffmpeg = spawn('ffmpeg', ['-i', 'bad_apple.mp4', '-vf', 'scale=51x36', `${__dirname}/../ResizedFrames/out-%d.png`]);

__ffmpeg.stdout.on('data',
	(data) =>
	{
		console.log('' + data);
	}
);

__ffmpeg.stderr.on('data',
	(data) =>
	{
		console.log('' + data);
	}
);

__ffmpeg.on('close',
	(code) =>
	{
		console.log(`ffmpeg finished with code ${code}`);
		
		main();
	}
);

// main();