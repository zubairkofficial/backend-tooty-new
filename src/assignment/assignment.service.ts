import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSVGdto } from './dto/svg.dto';
import { SuperAdminProfile } from 'src/profile/entities/super-admin.entity';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';



// const outputSchema = z.object({
//     description: z.string(),
//     exercise_elements: z.array(z.object({}))
// });


@Injectable()
export class AssignmentService {


    async saveWhiteboard(createSVGdto: CreateSVGdto) {
        const { description } = createSVGdto;
        try {
            const api = await SuperAdminProfile.findOne({
                attributes: ['openai'],
            });

            if (!api) {
                throw new HttpException('Unable to find API key', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            const api_key = api?.openai;

            if (api_key !== '') {
                const llm = new ChatOpenAI({
                    model: "gpt-3.5-turbo",
                    temperature: 0,
                    maxTokens: 1000,
                    timeout: 15000,
                    maxRetries: 2,
                    apiKey: api_key,
                });

const template  = `
You are an intelligent exercise generator. Your task is to generate a structured JSON representation of an interactive exercise based on the given description. The description will describe the components of an exercise (e.g., a house, a tree, etc.), but **you must infer** the necessary elements (shapes, colors, sizes, positions, etc.) based on the description. The output is intended for an **HTML canvas** (like FabricJS), so the generated elements must be compatible with rendering on a canvas.

**Always return valid JSON format**

**Output JSON format**:
{{
  "description": string,
  "exercise_elements": [
    {{
      "type": string (rect, circle, triangle, line, text, group),
      "content": string, 
      "position": {{ "x": number, "y": number }}, 
      "width": number, 
      "height": number, 
      "radius": number, 
      "fill": string, 
      "stroke": string, 
      "strokeWidth": number,
      "endPoints": {{
        "startX": number, 
        "startY": number, 
        "endX": number, 
        "endY": number
            }},
      "elements": [
        {{ 
          "type": string (rect, circle, triangle, line, text, group),
          "content": string,
          "position": {{ "x": number, "y": number }},
          "width": number, 
          "height": number, 
          "radius": number, 
          "fill": string, 
          "stroke": string, 
          "strokeWidth": number
            }}
      ]
            }},
    ...
  ]
            }}

**Rules**:
1. Parse the description and **dynamically decide** which components need to be created.
2. Use the following shapes:
   - **rect** for rectangles (e.g., backgrounds, shapes, placeholders).
   - **circle** for round elements (e.g., buttons, windows).
   - **triangle** for triangle elements (e.g., roofs).
   - **line** for lines (e.g., borders, outlines).
   - **text** for labels or instructions (e.g., numbers, words).
   - **group** to combine related elements (e.g., a set of objects or shapes).
3. If no specific size is given, choose a reasonable default size for the shape.
4. For **lines**, include the \`endPoints\` property to define the start and end points of the line.
5. For **group** elements, ensure there is an array of at least one element within the \`elements\` array.
6. If the description involves **missing numbers**, generate **text** elements with some text as numbers and other textboxes as placeholders for the missing numbers. Placeholders may have different colors (e.g., grey or transparent) to indicate they are empty.
7. Return only the generated JSON, no extra text.

**Input**:
- Description: {description}

Now, generate the exercise based on the title and description. Output must be in the exact format described above.

`

//                 const template = `
//                   You are an intelligent exercise generator. Your task is to generate a structured JSON representation of an interactive exercise based on the given description. The description will describe the components of an exercise (e.g., a house, a tree, etc.), but **you must infer** the necessary elements (shapes, colors, sizes, positions, etc.) based on the description. Do not rely on the teacher specifying exact shapes like rectangles, circles, or text boxes.
// **Always return valid JSON format**
// **Output JSON format**:
// {{
//   "description": string,
//   "exercise_elements": [
//     {{
//       "type": string (rect, circle, triangle, line, text, group),
//       "content": string, 
//       "position": {{ "x": number, "y": number }}, 
//       "width": number, 
//       "height": number, 
//       "radius": number, 
//       "fill": string, 
//       "stroke": string, 
//       "strokeWidth": number,
//       "endPoints": {{
//         "startX": number, 
//         "startY": number, 
//         "endX": number, 
//         "endY": number
//             }},
//       "elements": [
//         {{ 
//           "type": string (rect, circle, triangle, line, text, group),
//           "content": string,
//           "position": {{ "x": number, "y": number }},
//           "width": number, 
//           "height": number, 
//           "radius": number, 
//           "fill": string, 
//           "stroke": string, 
//           "strokeWidth": number
//             }}
//       ]
//             }},
//     ...
//   ]
//             }}

// **Rules**:
// 1. Parse the description and **dynamically decide** which components need to be created.
// 2. Use the following shapes:
//    - **rect** for rectangles. 
//    - **circle** for round elements. 
//    - **triangle** for triangle elements.
//    - **line** for lines.
//    - **text** for labels or instructions.
//    - **group** to combine related elements.
// 3. If no specific size is given, choose a reasonable default size for the shape.
// 4. For **lines**, include the \`endPoints\` property to define the start and end points of the line.
// 5. For **group** elements, ensure there is an array of at least one element within the \`elements\` array.
// 6. Return only the generated JSON, no extra text.

// **Input**:
// - Description: {description}

// Now, generate the exercise based on the title and description. Output must be in the exact format described above.

//               `;


                const SvgGenTemplate = ChatPromptTemplate.fromMessages([['system', template]]);
                const promptValue = await SvgGenTemplate.invoke({
                    description,
                });

                // const llm_structured = llm.withStructuredOutput(outputSchema);
                const result = await llm.invoke(promptValue);

                console.log("result", result?.content)

                return {
                    statusCode: 200,
                    data: result?.content,
                }
            } else {
                throw new HttpException('OpenAI API key is missing', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (error) {
            console.log("error", error)
            throw new HttpException(error.message || 'Failed to create svg', HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }
}
