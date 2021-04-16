import * as getPixels from "image-pixels";
import * as fs from "fs";

import { spawn } from 'child_process';

import { Client, Message, TextChannel } from 'discord.js';

//#region Tokens

import * as dotenv from 'dotenv';
dotenv.config();

let tokens = [
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
//#endregion
			 

//Select video
let video = process.argv[2] == undefined ? "bad_apple.mp4" : process.argv[2];

// function hexToRgb(hex: string)
// {
// 	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
// 	return result ? {
// 		r: parseInt(result[1], 16),
// 		g: parseInt(result[2], 16),
// 		b: parseInt(result[3], 16)
// 	} : null;
// }

// class Square
// {
// 	hex: string;
// 	r: number;
// 	g: number;
// 	b: number;
// 	symbol: string;
	
// 	constructor(hex: string, symbol: string)
// 	{
// 		this.hex = hex;
		
// 		let _rgb = hexToRgb(hex);
		
// 		this.r  =_rgb.r;
// 		this.b = _rgb.b;
// 		this.g = _rgb.g;
		
// 		this.symbol = symbol;
// 	}
// }

async function sleep(time: number)
{
	return new Promise(resolve => setTimeout(resolve, time));
}

async function main()
{
	type PixelData = {data: Uint8Array, width: number, height: number};
	
	let frames: string[] = [];
	
	const length = fs.readdirSync(`${__dirname}/../ResizedFrames`).length;
	
	//Create string from pixels
	for(let i = 0; i < length; i++) //6572
	{
		let pixelData: PixelData = await getPixels(`./ResizedFrames/out-${i + 1}.png`);
		
		let mes = "\`";
		
		for(let j = 0; j < pixelData.data.length; j += 4)
		{
			let value = .3 * pixelData.data[j] + .59 * pixelData.data[j + 1] + .11 * pixelData.data[j + 2];
			
			if(value < 56) mes += "⬛";
			else if(value < 131) mes += "🔳";
			else if(value < 221) mes += "🔲";
			else mes += "⬜";
			
			if(Math.floor(j/4) % 51 == 50) mes += "\n";
		}
		
		frames.push(mes + "\`");
		
		if(i % 200 == 0) console.log(i / length * 100 + "%"); //Only regularly update progress bar
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
					if(message.content.startsWith(`!${video}`))
					{
						await sleep(index * 200);

						while(frameIndex < frames.length)
						{
							message.channel.send(frames[Math.floor(frameIndex)]);
							
							frameIndex += 6; //Corrects framerate to run at 30 FPS
							
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

let __ffmpeg = spawn('ffmpeg', ['-i', video, '-vf', 'scale=51x36', `${__dirname}/../ResizedFrames/out-%d.png`]);

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