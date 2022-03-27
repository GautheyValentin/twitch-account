declare namespace NodeJS {
  export interface ProcessEnv {
    ANTICAPTCHA_API_KEY: string;
    PROXY_HOST: string;
    PROXY_PORT: string;
    PROXY_USER: string;
    PROXY_PASS: string;
    PROXY_TYPE: string;
  }
}
