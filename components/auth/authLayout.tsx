import Image from "next/image";
import { Divider } from "@nextui-org/divider";

interface Props {
  children: React.ReactNode;
}

export const AuthLayoutWrapper = ({ children }: Props) => {
    return (
        <div className='flex h-screen'>
            <div className='flex-1 flex-col flex items-center justify-center p-6'>
                <div className='md:hidden absolute left-0 right-0 bottom-0 top-0 z-0'>
                    <Image
                        className='w-full h-full'
                        src='/images/login-bg.png'
                        alt='gradient'
                        width={100}
                        height={100}
                    />
                </div>
                {children}
            </div>

            <div className='hidden my-10 md:block'>
                <Divider orientation='vertical'/>
            </div>

            <div className='md:flex flex-1 relative flex items-center justify-center p-6'>
                <div className='absolute left-0 right-0 bottom-0 top-0 z-0'>
                    <Image
                        className='w-full h-full'
                        src='/images/login-bg.png'
                        alt='gradient'
                        width={100}
                        height={100}
                    />
                </div>
                <div className='z-10'>
                    <h1 className='font-bold text-[45px]'>Welcome to Settlo</h1>
                    <div className='font-light text-slate-400 mt-4'>
                        <p className="text-medium">Login with your credentials or register to continue using the Dashboard, Download
                            Settlo App from Playstore and Appstore to use our POS in your android or iOS devices
                        </p>

                        <div className='mt-4 flex gap-6'>
                            <div className="flex flex-col items-center">
                                <div>
                                    <Image src="/images/apple.svg" width={40} height={40} alt='Apple AppStore'/>
                                </div>
                                <p className="text-sm font-bold text-center">AppStore</p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div>
                                    <Image src="/images/google-play.svg" width={40} height={40} alt='Google PlayStore'/>
                                </div>
                                <p className="text-sm font-bold text-center">PlayStore</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
