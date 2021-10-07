import { cli } from "./cli"

describe("cli", () => {
  test("--help", () => {
    cli.parse("--help", {}, (err, _argv, _output) => {
      expect(err).toBeFalsy()
    })
  })
})
