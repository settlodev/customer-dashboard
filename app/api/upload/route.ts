import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client } from '@aws-sdk/client-s3'
import { v4 } from 'uuid'

export async function POST(request: Request) {
    const { contentType } = await request.json()

    try {
        const client = new S3Client({region: process.env.AWS_REGION})
        const { url, fields } = await createPresignedPost(client, {
            Bucket: "fhuvexerkaysoazmmlal",
            Key: v4(),
            Conditions: [
                ['content-length-range', 0, 10485760], // up to 10 MB
                ['starts-with', '$Content-Type', contentType],
            ],
            Fields: {
                acl: 'public-read',
                'Content-Type': contentType,
            },
            Expires: 600, // Seconds before the presigned post expires. 3600 by default.
        })

        return Response.json({ url, fields })
    } catch (error) {
        console.log("error:", error);
        return Response.json({ error: "Imag upload error" })
    }
}
