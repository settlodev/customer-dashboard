import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import {Button} from "@/components/ui/button";

interface ArchieveModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onArchieve: () => void;
  itemName: string;
}

export default function ArchieveModal({
  isOpen,
  onOpenChange,
  onArchieve,
  itemName,
}: ArchieveModalProps) {
  return (
    <>
      <Modal
        backdrop="blur"
        className="lg:w-1/4 p-4 rounded-2xl border-t-gray-300"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        placement="center"
        radius="sm"
        size="sm"
        onOpenChange={onOpenChange} style={{background:'#FAFAFA'}}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 mt-3">
                Confirm Archiving
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to archieve{" "}
                  <span className="font-bold text-destructive">{itemName}</span>{" "}
                  ?
                  <br />
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onClick={onArchieve}>
                  Archieve
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
