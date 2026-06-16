import csvtojson from 'csvtojson';
import path from 'path';

interface CSVFAQ {
    slug: string;
    title: string;
    content: string;
}

const mapCSVToFAQ = async (csv_faq: CSVFAQ) => {
    return {
        question: csv_faq.title,
        slug: csv_faq.slug,
        answer: csv_faq.content
    }
}

const importFAQsFromCSV = async () => {
    // Path is relative to packages/strapi
    const csvFilePath = path.resolve(
        './src/plugins/import-csv/data/faqs_data.csv'
    );
    const data = await csvtojson().fromFile(csvFilePath);

    const faqs = await Promise.all(
        data.map(async (csv_faq) => {
            return await mapCSVToFAQ(csv_faq);
        })
    );

    for (const faq of faqs) {
        if (!faq) {
            return;
        }

        /**
         * @see https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/entity-service/crud.html#create
         */
        try {
            await strapi.documents('api::faq.faq').create({
                data: faq,
            });
        } catch (err) {
            console.log('Error creating faq', faq, err /*.details*/);
        }
    }
}

export default importFAQsFromCSV;
