import Command from "../../core/command";

export default class Create extends Command {
  async run(): Promise<any> {
    try {
      const { flags } = this.parse(Create);
      this.setup(flags);
      const result: string = await new Promise((res) => {
        setTimeout(() => res("Operation Performed successfully"), 3000);
      });
      this.log(result);
    } catch (error) {
      this.log("Something broke", error);
    }
  }
}
