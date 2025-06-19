import { Card, CardContent } from "../ui/card";



const GeneralSettings = () => (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-semibold">General</h2>
            <p className="text-muted-foreground mt-1">
                Customize your personal preferences and display settings
            </p>
        </div>
        <Card>
            <CardContent className="pt-6">
                <p className="text-muted-foreground">Preferences settings will be implemented here.</p>
            </CardContent>
        </Card>
    </div>
);

export default GeneralSettings;