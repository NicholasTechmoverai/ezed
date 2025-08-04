import axios from 'axios';

export default {
  downloadInstagram: (id) => {
    return axios.post(`/api/inst/${id}/download`);
  }
};
