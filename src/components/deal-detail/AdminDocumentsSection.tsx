import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

interface AdminDocumentsSectionProps {
  deal: any;
}

const AdminDocumentsSection = ({ deal }: AdminDocumentsSectionProps) => {
  const handleDownload = (file: any) => {
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.original_name || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                      {(file.file_size / 1024 / 1024).toFixed(2)} MB • {file.file_type.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded on {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-primary/10"
                  onClick={() => handleDownload(file)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No documents uploaded</p>
            <p className="text-sm text-muted-foreground">The user hasn't uploaded any documents for this deal yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDocumentsSection;