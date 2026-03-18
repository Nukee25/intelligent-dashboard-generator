import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dashboardRouter from './routes/dashboard';

const app = express();
const parsedPort = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;
const PORT = !isNaN(parsedPort) ? parsedPort : 3001;

app.use(cors());
app.use(express.json());

app.use('/api', dashboardRouter);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

export default app;
