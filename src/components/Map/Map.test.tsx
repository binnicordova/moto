import {render} from "@testing-library/react-native";
import {Map} from "./Map";

describe("Map Component", () => {
    it("should render correctly", () => {
        const {toJSON} = render(<Map />);
        expect(toJSON()).toBeTruthy();
    });
});
