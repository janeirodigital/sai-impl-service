import express, { Request, Response} from 'express';
import jwtDecode from "jwt-decode";

const usersRouter = express.Router({ caseSensitive: false });

usersRouter.get('/:id', async (req: Request, res: Response) => {
    // TODO (angel) ??
    const { id } = req.params;
    const tokenHeader = req.header('Authorization')?.split(' ')[1]; // Leave the `DPoP ` behind.

    if(!tokenHeader) {
        res.status(401).send();
        return;
    }

    // TODO (angel) verify that the token is valid. jwtDecode does not perform signature verification
    const { azp: applicationId } = jwtDecode<{azp: string}>(tokenHeader);

    for await (const registration of req.saiSession!.applicationRegistrations) {
        if (registration.registeredAgent == applicationId) {
            res.status(200)
                .header('content-type', 'text/turtle')
                // TODO (angel) hardcoded rel value
                .header('Link', `<${applicationId}>; anchor="${registration.iri}"; rel="http://www.w3.org/ns/solid/interop#registeredAgent"`)
                .send();
            return;
        }
    }

    res.status(401)
        .header('content-type', 'text/turtle')
        .send();
    return;
});

export default usersRouter;
