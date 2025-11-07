import app from "./app.js";
import { ENV } from "./env.js";

const PORT = ENV.PORT;

app.listen(PORT, () => {
    console.log(`🚀 Hello,  Server running on: http://localhost:${PORT}`);
});
