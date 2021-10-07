import { hideBin } from "yargs/helpers"

import { cli } from "./cli"

cli.parse(hideBin(process.argv))
