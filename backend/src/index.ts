import dotenv from 'dotenv';
import { join } from 'path';
dotenv.config({ path: join(process.cwd(), '..', '.env') });

import app from './app.js';

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log('MISTRAL_API_KEY loaded:', process.env.MISTRAL_API_KEY ? 'Yes' : 'No');