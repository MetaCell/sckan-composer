import statementService from "../services/StatementService";
import {userProfile} from "../services/UserService";

export const checkOwnership = (
  id: number,
  onSave: (fetchedData: any, userId: number) => Promise<any>,
  onCancel: (fetchedData: any, userId: number) => void,
  alertMessage: (owner: any) => string
) => {
  const userId = userProfile.getUser().id;
  // Fetch the latest data to check for ownership
  statementService.getObject(id.toString())
    .then((fetchedData: any) => {
      // Check if the fetched data has an owner and if the current user is not the owner
      if (fetchedData.owner && fetchedData.owner.id !== userProfile.getUser().id) {
        const userConfirmed = window.confirm(alertMessage(fetchedData.owner));

        if (userConfirmed) {

          // Reassign ownership and save the data
          statementService.assignOwner(fetchedData.id, {
            ...fetchedData,
            owner_id: userId, // Assign ownership to the current user
          })
            .then(() => {
              // Call the merged save action
              return onSave(fetchedData, userId)
            })
            .catch((error) => {
              console.error("Failed to reassign ownership", error);
              onCancel(fetchedData, userId);
            });
        } else {
          onCancel(fetchedData, userId);
        }
      }
    })
    .catch((fetchError) => {
      console.error("Failed to fetch the data", fetchError);
      onCancel(null, userId);
    });
};
