import { Op } from "sequelize";
import { GetVoiceModelDto, UpdateApiKeyDto } from "./dto/update-api.dto";
import axios from "axios";
import { SuperAdminProfile } from "src/profile/entities/super-admin.entity";
import { HttpException, HttpStatus } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
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

    async checkDeepgramApiKey(apiKey: string) {
        try {
            const response = await axios.post(
                `https://api.deepgram.com/v1/speak?model=aura-asteria-en`,
                { text: "Hello" },
                {
                    headers: {
                        Authorization: `Token ${apiKey}`,
                    },
                    responseType: "arraybuffer",
                }
            );
            console.log('API Key is valid:', response.data);
            return true;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.error('Invalid API Key');
            } else {
                console.error('Error verifying API Key:', error.message);
            }
            const transporter = nodemailer.createTransport({
                host: `${process.env.EMAIL_HOST}`,
                port: Number(`${process.env.EMAIL_PORT}`),
                secure: false,
                auth: {
                    user: `${process.env.EMAIL_USERNAME}`,
                    pass: `${process.env.EMAIL_PASSWORD}`,
                },
            });

            // Send email
            await transporter.sendMail({
                from: `${process.env.EMAIL_FROM_ADDRESS}`,
                to: "engrmuqeetahmad@gmail.com", // Use the provided email
                subject: 'Your Deepgram API Key at Tooty',
                text: `This is auto generated Email, There is a problem with DeepGram API key 
                                \n
                                the raw error is here ${error.message}
                                
                                `
            });

            return false;
        }
    }


    async getDeepGramApi(req: any) {
        try {
            const data = await SuperAdminProfile.findOne({
                attributes: ["deepgram"]
            })

            // Validate API key
            const isKeyValid = await this.checkDeepgramApiKey(data?.deepgram);
            if (!isKeyValid) {
                throw new Error('The DeepGram API key is invalid or expired. Please update the key.');
            }
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
