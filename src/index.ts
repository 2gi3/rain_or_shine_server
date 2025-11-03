import app from "./app.js";
import { ENV } from "./env.js";
import { hello } from "./hello.js";

const PORT = ENV.PORT;

app.listen(PORT, () => {
    hello();
    console.log(`🚀 Hello,  Server running on: http://localhost:${PORT}`);
});
