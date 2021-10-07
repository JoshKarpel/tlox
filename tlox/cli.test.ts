import { cli } from "./cli"

describe("cli", () => {
  test("--help", () => {
    cli.parse("--help", {}, (err, _argv, _output) => {
      expect(err).toBeFalsy()
    })
  })

  test("default command is run", () => {
    cli.parse("foo", {}, (err, argv, _output) => {
      expect(err).toBeFalsy()
      expect(argv.path).toEqual("foo")
    })
  })
})
