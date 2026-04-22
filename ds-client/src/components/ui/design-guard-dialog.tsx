import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './dialog';
import { Button } from './button';
import { subscribePending, resolveUserChoice } from '@/lib/design-guard';

export function DesignGuardDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => subscribePending(setOpen), []);

  const choose = (action: 'save' | 'discard' | 'cancel') => {
    resolveUserChoice(action);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) choose('cancel'); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save changes to this table?</DialogTitle>
          <DialogDescription>
            You have unsaved changes to the table design. Do you want to save them
            before switching tables?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => choose('cancel')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => choose('discard')}>
            Discard
          </Button>
          <Button
            onClick={() => choose('save')}
            className="bg-[#C42B1C] hover:bg-[#9B2118] text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
