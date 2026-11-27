
export type RootStackParamList = {
  Home: undefined;
  Registration: undefined;
  Login: undefined;
  OTP: {
    name?: string;
    mobile: string;
    flow?: "registration" | "login";
  };
  Dashboard: undefined;
};
