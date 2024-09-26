import * as https from "https";
import axios from "axios";

export const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});
