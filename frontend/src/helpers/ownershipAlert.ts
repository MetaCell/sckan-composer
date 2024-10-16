import statementService from "../services/StatementService";
import {userProfile} from "../services/UserService";
import {User} from "../apiclient/backend";

export const checkOwnership = (
  id: number,
  onSave: (fetchedData: any, userId: number) => Promise<any>,
  onCancel: (fetchedData: any, userId: number) => void,
  alertMessage: (owner: any) => string
): Promise<void> => {
  const userId = userProfile.getUser().id;
  return new Promise((resolve, reject) => {
    // Fetch the latest data to check for ownership
    statementService.getObject(id.toString())
      .then((fetchedData: any) => {
        // Check if the fetched data has an owner and if the current user is not the owner
        if (fetchedData.owner && fetchedData.owner.id !== userId) {
          const userConfirmed = window.confirm(alertMessage(fetchedData.owner));

          if (userConfirmed) {
            // Reassign ownership and save the data
            statementService.assignOwner(fetchedData.id, {})
              .then(() => {
                // Call the merged save action
                return onSave(fetchedData, userId)
                  .then((result) => resolve(result))
                  .catch((error) => reject(error));
              })
              .catch((error) => {
                console.error("Failed to reassign ownership", error);
                onCancel(fetchedData, userId);
                reject(error);
              });
          } else {
            onCancel(fetchedData, userId);
            resolve(); // Resolve since user canceled, but operation is complete
          }
        }
      })
      .catch((fetchError) => {
        console.error("Failed to fetch the data", fetchError);
        onCancel(null, userId);
        reject(fetchError);
      });
  });
};


export const getOwnershipAlertMessage = (owner: User) => {
  return `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
}