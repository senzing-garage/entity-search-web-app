
// were overriding this one temporarily for prototyping purposes
export interface AdminStreamConnProperties {
    connected: boolean;
    clientId?: string;
    hostname: string;
    port?: number;
    secure?: boolean;
    connectionTest: boolean;
    reconnectOnClose: boolean;
    reconnectConsecutiveAttemptLimit: number;
    path: string;
    method?: string;
    /** url explicitly overrides any of the individual connection properties.
    it is used for cloud environments where the client needs to open up
    socket connections to loadbalancers/gateways that don't correspond to
    anything on the local instance  */
    url?: string;
}
// now export the rest of the bad bunnys
export { AdminStreamAnalysisConfig, AdminStreamLoadConfig, AdminStreamUploadRates } from '@senzing/sdk-components-ng';
