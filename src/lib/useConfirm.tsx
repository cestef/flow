import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useState } from "react";

type ConfirmState = {
	isOpen: boolean;
	message: string;
	resolve: (value: boolean) => void;
};

const useConfirm = () => {
	const [confirmState, setConfirmState] = useState<ConfirmState>({
		isOpen: false,
		message: "",
		resolve: () => {},
	});

	const confirm = async (message: string): Promise<boolean> => {
		return new Promise((resolve) => {
			setConfirmState({
				isOpen: true,
				message,
				resolve,
			});
		});
	};

	const handleConfirm = (result: boolean) => {
		confirmState.resolve(result);
		setConfirmState((prevState) => ({
			...prevState,
			isOpen: false,
		}));
	};

	return {
		confirm,
		modal: (
			<AlertDialog open={confirmState.isOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							{confirmState.message}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => handleConfirm(false)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={() => handleConfirm(true)}>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		),
	};
};

export default useConfirm;
