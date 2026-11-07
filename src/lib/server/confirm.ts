/**
 * The check of a destructive action, for the server side of ConfirmDelete: the person must have typed the exact name of what is
 * deleted. The browser enforces it too, but only this check counts.
 */
export function isConfirmed(form: FormData, name: string): boolean {
    return form.get('confirm') === name;
}
