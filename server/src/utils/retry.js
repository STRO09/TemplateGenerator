export default async function retry(
    operation,
    {
        retries = 5,
        initialDelay = 1000,
        maxDelay = 30000,
        factor = 2,
        onRetry = () => {}
    } = {}
) {
    let delay = initialDelay;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (err) {
            if (attempt === retries) {
                throw err;
            }

            onRetry(err, attempt, delay);

            await new Promise(resolve =>
                setTimeout(resolve, delay)
            );

            delay = Math.min(delay * factor, maxDelay);
        }
    }
}