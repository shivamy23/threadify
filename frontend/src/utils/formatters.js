// Reddit-style formatters
export const formatUsername = (username) => `u/${username}`;
export const formatCommunity = (slug) => `t/${slug}`;

export const getUserPath = (username) => `/u/${username}`;
export const getCommunityPath = (slug) => `/t/${slug}`;
