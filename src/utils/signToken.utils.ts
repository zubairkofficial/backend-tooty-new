import { sign } from 'jsonwebtoken';

export const SignAccessToken = (payload: { sub: number; email: string, level_id: number | null, school_id: number | null, role: string, district_id: number | null, user_roll_no: string | null }) => {
  const token = sign(payload, `${process.env.JWT_SECRET_KEY}`, {
    expiresIn: "1d",
  });
  return token;
};

export const SignRefreshToken = (payload: { sub: number; email: string, level_id: number | null, school_id: number | null, role: string, district_id: number | null, user_roll_no: string | null }) => {
  return sign(payload, `${process.env.JWT_SECRET_KEY}`, { expiresIn: '14d' });
};
