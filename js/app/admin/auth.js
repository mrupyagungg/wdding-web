import { util } from '../../common/util.js';
import { bs } from '../../libs/bootstrap.js';
import { dto } from '../../connection/dto.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { pool, cacheRequest, request, HTTP_GET, HTTP_STATUS_OK } from '../../connection/request.js';

export const auth = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let user = null;

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const login = (button) => {
        const btn = util.disableButton(button);

        const formEmail = document.getElementById('loginEmail');
        const formPassword = document.getElementById('loginPassword');

        formEmail.disabled = true;
        formPassword.disabled = true;

        session.login(dto.postSessionRequest(formEmail.value, formPassword.value)).then((res) => {
            if (res) {
                formEmail.value = null;
                formPassword.value = null;
                bs.modal('mainModal').hide();
            }
        }).finally(() => {
            btn.restore();
            formEmail.disabled = false;
            formPassword.disabled = false;
        });
    };

    /**
     * @returns {Promise<void>}
     */
    const clearSession = async () => {
        await pool.restart(cacheRequest);

        user.clear();
        session.logout();
        bs.modal('mainModal').show();
    };

    /**
     * @returns {Promise<object>}
     */
    const getDetailUser = () => {
        return request(HTTP_GET, '/api/user').token(session.getToken()).send().then((res) => {
            if (res.code !== HTTP_STATUS_OK) {
                throw new Error('failed to get user.');
            }

            Object.entries(res.data).forEach(([k, v]) => user.set(k, v));

            return res;
        }).catch((err) => {
            clearSession();
            return err;
        });
    };

    /**
     * @returns {ReturnType<typeof storage>|null}
     */
    const getUserStorage = () => user;

    /**
     * @returns {void}
     */
    const init = () => {
        user = storage('user');
    };

    return {
        init,
        login,
        clearSession,
        getDetailUser,
        getUserStorage,
    };
})();