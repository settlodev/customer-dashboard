import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import {Button} from "@/components/ui/button";

interface DeleteModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onDelete: () => void;
  itemName: string;
}

export default function DeleteModal({
  isOpen,
  onOpenChange,
  onDelete,
  itemName,
}: DeleteModalProps) {
  return (
    <>
      <Modal
        backdrop="blur"
        className="w-1/4"
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
              <ModalHeader className="flex flex-col gap-1">
                Confirm Deletion
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-destructive">{itemName}</span>{" "}
                  ?
                  <br />
                  This action cannot be undone!
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onClick={onDelete}>
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
