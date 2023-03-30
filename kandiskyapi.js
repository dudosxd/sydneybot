import axios from 'axios';
import fs from 'fs/promises';

// Define the function for generating an image from text
export async function generate(prompt, path) {
  try {
    // Send a request for generation and get the task ID
    const response = await axios.post('https://fusionbrain.ai/api/v1/text2image/run', {
      queueType: 'generate',
      query: prompt,
      preset: 1,
      style: '',
    });
    const id = response.data.result.pocketId;

    // Wait for the result while checking the status
    while ((await axios.get(`https://fusionbrain.ai/api/v1/text2image/generate/pockets/${id}/status`)).data.result !== 'SUCCESS') {
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Get the result as base64 code
    const result = await axios.get(`https://fusionbrain.ai/api/v1/text2image/generate/pockets/${id}/entities`);
    const newjpgtxt = result.data.result[0].response[0];

    // If the code exists, decode it into an image and save it to a file
    if (newjpgtxt) {
      const imageBuffer = Buffer.from(newjpgtxt, 'base64');
      await fs.writeFile(`${path}/0.png`, imageBuffer);
      return true;
    }
  } catch (error) {
    console.error(error);
  }

  return false;
}
