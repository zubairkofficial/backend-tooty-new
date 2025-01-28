import { Op } from "sequelize";
import { GetVoiceModelDto, UpdateApiKeyDto } from "./dto/update-api.dto";
import axios from "axios";
import { SuperAdminProfile } from "src/profile/entities/super-admin.entity";
import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiService {

    async getVoiceModel(getVoiceModelDto: GetVoiceModelDto) {
        try {
            const response = await axios.get(`https://api.deepgram.com/v1/models/${getVoiceModelDto.model_id}`);

            return {
                statusCode: 200,
                data: response?.data
            }
        } catch (error) {
            throw new HttpException(error.message || "Failed getting model", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getDeepGramModels(req: any) {
        try {
            const response = await axios.get(
                "https://api.deepgram.com/v1/models", // Deepgram API endpoint
                // {
                //     headers: {
                //         "Authorization": `Token YOUR_DEEPGRAM_API_KEY`, // Replace with your API key
                //         "Content-Type": "multipart/form-data",
                //     },
                // }
            );
            console.log(response)
            return {
                statusCode: 200,
                api: response?.data
            }
        } catch (error) {
            throw new HttpException(error.message || "Failed getting models", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getDeepGramApi(req: any) {
        try {
            const data = await SuperAdminProfile.findOne({
                attributes: ["deepgram"]
            })
            return {
                statusCode: 200,
                api: data
            }
        } catch (error) {
            throw new HttpException(error.message || "Failed getting API key", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAllApiKeys(req: any) {
        try {
            const data = await SuperAdminProfile.findAll({
                where: {
                    user_id: {
                        [Op.eq]: req.user.sub
                    }
                }
            })
            return {
                statusCode: 200,
                apis: data
            }
        } catch (error) {
            throw new HttpException(error.message || "Failed getting API keys", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



    async updateApiKey(updateApiKeyDto: UpdateApiKeyDto, req: any) {
        try {
            if (updateApiKeyDto.api_name == "openai") {
                await SuperAdminProfile.update({
                    openai: updateApiKeyDto.api_key,
                },
                    {
                        where: {
                            user_id: req.user.sub,

                        }
                    })

            }

            if (updateApiKeyDto.api_name == "dalle") {
                await SuperAdminProfile.update({
                    dalle: updateApiKeyDto.api_key,
                },
                    {
                        where: {
                            user_id: req.user.sub,

                        }
                    })
            }
            if (updateApiKeyDto.api_name == "deepgram") {
                await SuperAdminProfile.update({
                    deepgram: updateApiKeyDto.api_key,
                },
                    {
                        where: {
                            user_id: req.user.sub,

                        }
                    })
            }
            return {
                statusCode: 200,
                message: "api updated successfully"
            }
        } catch (error) {
            throw new HttpException(error.message || "Failed updating API key", HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }


}
