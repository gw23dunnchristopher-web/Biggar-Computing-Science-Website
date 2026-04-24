import { r as reactExports } from "./index-DZjJp9Jo.js";
var DirectionContext = reactExports.createContext(void 0);
function useDirection(localDir) {
  const globalDir = reactExports.useContext(DirectionContext);
  return localDir || globalDir || "ltr";
}
export {
  useDirection as u
};
//# sourceMappingURL=index-D-MpoJPS.js.map
