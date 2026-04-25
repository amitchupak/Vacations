import axios, { InternalAxiosRequestConfig } from "axios";

// Adds the saved login token to every outgoing request automatically,
// so we don't have to remember to attach it in each service call.
class Interceptor {
    public create(): void {
        axios.interceptors.request.use((httpRequest: InternalAxiosRequestConfig) => {
            const token = localStorage.getItem("token");
            if (token) {
                httpRequest.headers.Authorization = "Bearer " + token;
            }
            return httpRequest;
        });
    }
}

// One shared instance — call interceptor.create() once at app start.
export const interceptor = new Interceptor();
