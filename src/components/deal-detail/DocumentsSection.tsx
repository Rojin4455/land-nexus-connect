import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Download } from 'lucide-react';

interface DocumentsSectionProps {
  deal: any;
}

const DocumentsSection = ({ deal }: DocumentsSectionProps) => {
  console.log("deal:", deal)
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Documents & Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deal.files && deal.files.length > 0 ? (
          <div className="space-y-3">
            {deal.files.map((file: any) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.original_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
            <p className="text-sm text-muted-foreground">Upload photos, videos, or documents to support your deal</p>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-border">
          <Button variant="outline" className="w-full hover:bg-primary/5">
            <Upload className="h-4 w-4 mr-2" />
            Upload Additional Files
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentsSection;