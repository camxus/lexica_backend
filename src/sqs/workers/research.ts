import { SQSEvent } from "aws-lambda";
import { generateResearch } from "../../cron/generateResearch";
import { storeResearch } from "../../cron/store";


export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    try {
      const { topic, slug, date } = JSON.parse(record.body);

      const research = await generateResearch(topic);

      for (let level = 1; level <= 5; level++) {
        await storeResearch(
          slug,
          date,
          level,
          research[`level_${level}` as "level_1"],
          research.references
        );
      }
    } catch (err) {
      console.error("Failed to process SQS message:", err);
      // message will be retried automatically based on SQS settings
    }
  }
};
