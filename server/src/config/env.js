import dotenv from 'dotenv';
dotenv.config();

const required = (key, fallback) => {
  const val = process.env[key] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
};

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: required(
    'MONGO_URI',
    'mongodb+srv://karthikeyantoff_db_user:yuKGJ6diIHTU90pr@cluster0.zibm66x.mongodb.net/SyncForge_db?retryWrites=true&w=majority'
  ),
  jwtSecret: required('JWT_SECRET', 'syncforge_super_secure_jwt_secret_token_key_2026_at_least_32_chars'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'cblqllb4',
    apiKey: process.env.CLOUDINARY_API_KEY || '395367419741642',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '1SG9xf-6HZKzVgQu3Im-nFKuFZ4',
    folder: process.env.CLOUDINARY_FOLDER || 'mern_stack_project_storage/SyncForge_storage',
  },
};
