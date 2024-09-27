import type {
    Adapter,
    AdapterUser,
    AdapterSession,
    VerificationToken,
} from "@auth/core/adapters";

import axios from "axios";

export function SpringAuthAdapter(apiUrl: string): Adapter {
    return {
        async createUser(user) {
            const response = await axios.post(`${apiUrl}/auth/register`, user);

            return response.data as AdapterUser;
        },
        async getUser(id) {
            try {
                const response = await axios.get(`${apiUrl}/users/${id}`);

                return response.data as AdapterUser;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    return null;
                }
                throw error;
            }
        },
        async getUserByEmail(email) {
            try {
                const response = await axios.get(`${apiUrl}/users/email/${email}`);

                return response.data as AdapterUser;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    return null;
                }
                throw error;
            }
        },

        async getUserByAccount({ providerAccountId, provider }) {
            try {
                const response = await axios.get(
                    `${apiUrl}/users/account/${provider}/${providerAccountId}`,
                );

                return response.data as AdapterUser;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    return null;
                }
                throw error;
            }
        },
        async updateUser(user) {
            const response = await axios.put(`${apiUrl}/users/${user.id}`, user);

            return response.data as AdapterUser;
        },
        async deleteUser(userId) {
            await axios.delete(`${apiUrl}/users/${userId}`);
        },
        async linkAccount(account) {
            await axios.post(`${apiUrl}/accounts`, account);
        },
        async unlinkAccount({ providerAccountId, provider }) {
            await axios.delete(`${apiUrl}/accounts`, {
                params: { providerAccountId, provider },
            });
        },
        async createSession(session) {
            const response = await axios.post(`${apiUrl}/sessions`, session);

            return response.data as AdapterSession;
        },
        async getSessionAndUser(sessionToken) {
            try {
                const response = await axios.get(`${apiUrl}/sessions/${sessionToken}`);

                return response.data as { session: AdapterSession; user: AdapterUser };
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    return null;
                }
                throw error;
            }
        },
        async updateSession(session) {
            const response = await axios.put(
                `${apiUrl}/sessions/${session.sessionToken}`,
                session,
            );

            return response.data as AdapterSession;
        },
        async deleteSession(sessionToken) {
            await axios.delete(`${apiUrl}/sessions/${sessionToken}`);
        },
        async createVerificationToken(token) {
            const response = await axios.post(`${apiUrl}/verification-tokens`, token);

            return response.data as VerificationToken;
        },
        async useVerificationToken({ identifier, token }) {
            try {
                const response = await axios.post(`${apiUrl}/verification-tokens/use`, {
                    identifier,
                    token,
                });

                return response.data as VerificationToken;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    return null;
                }
                throw error;
            }
        },
    };
}
