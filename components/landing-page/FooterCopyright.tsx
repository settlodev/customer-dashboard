const FooterCopyright = () => (
    <div className="border-t border-gray-800">
        <div className="max-w-[85rem] mx-auto px-4 py-5">
            <p className="text-xs text-center text-gray-600">
                &copy; {new Date().getFullYear()} Settlo Technologies Ltd. All rights reserved.
            </p>
        </div>
    </div>
);

export {FooterCopyright};
