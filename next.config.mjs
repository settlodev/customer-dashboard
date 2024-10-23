/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'fhuvexerkaysoazmmlal.supabase.co',
                port: '', // Leave empty if the image uses the default port
                pathname: '/storage/v1/object/public/Data/products/**', // Allows images from the specified path
            },
        ],
    },
};

export default nextConfig;
