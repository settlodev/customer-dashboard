/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['fhuvexerkaysoazmmlal.supabase.co','lporvjkotuidemnfvuzt.supabase.co','images.unsplash.com','app.tallity.co.tz'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'fhuvexerkaysoazmmlal.supabase.co',
                port: '',

            },
        ]
    },
};

export default nextConfig;
