import { authApi, composerApi } from "./apis";
import { Profile, User } from '../apiclient/backend';


export let userProfile = (function () {
  var privateUserProfile: Profile = {} as Profile;

  return { // public interface
    setProfile: function (profile: Profile) {
      privateUserProfile = profile;
    },
    getProfile: function (): Profile {
      return privateUserProfile;
    },
    getUser: function(): User {
      return privateUserProfile.user;
    },
    isSignedIn: function (): boolean {
      return JSON.stringify(privateUserProfile) !== JSON.stringify({} as Profile);
    },
    clearProfile: function () {
      privateUserProfile = {} as Profile;
    }
  };
})();

export async function login(): Promise<any> {
  return authApi.metacellAuthLoginRetrieve()
}

export async function logout(): Promise<any> {
  return authApi.metacellAuthLogoutRetrieve()
}

export async function doLogin() {
  try {
    const response = await composerApi.composerProfileMyRetrieve();
    userProfile.setProfile(response.data);
  } catch (error) {
    const response = await login();
    if (response.data.status_code === 302) {
      window.location.href = response.data.redirect_url;
    }
  }
};
