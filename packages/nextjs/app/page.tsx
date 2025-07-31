"use client";

import { useEffect } from "react";
import { useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState<File>();
  const server = process.env.NEXT_PUBLIC_SERVER_URL;

  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  const handleFileChange = (event: any) => {
    // Obtener el primer archivo seleccionado
    const file = event.target.files[0];
    console.log(file);
    setSelectedFile(file);
  };

  async function upload() {
    const url = "https://uploads.pinata.cloud/v3/files";
    const form = new FormData();
    form.append("network", "public");

    form.append("file", selectedFile as Blob, selectedFile?.name);
    // form.append("pinataMetadata",
    //   JSON.stringify({
    //     name: selectedFile.name,
    //   })
    // )
    //form.append("name", selectedFile?.name);

    const options = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.NEXT_PUBLIC_PINATA_JWT,
      },
      body: form,
    };

    //options.body = form;

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  }

  const options = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + process.env.NEXT_PUBLIC_PINATA_JWT,
    },
  };

  useEffect(() => {
    // This effect runs once when the component mounts
    const getFiles = () => {
      fetch("https://api.pinata.cloud/v3/files/public", options)
        .then(response => response.json())
        .then(response => {
          setFiles(response.data.files);
          console.log(response.data.files);
        })
        .catch(err => console.error(err));
    };

    getFiles();
  }, []);

  return (
    <>
      Address:
      <Address address={connectedAddress}></Address>
      Subir NFT
      <input type="file" className="file-input file-input-ghost" onChange={handleFileChange} />
      <button className="btn" onClick={() => upload()}>
        UpLoad
      </button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {files.map((file: IPFSFile) => (
          <div className="bg-base-200 p-4 rounded-box" key={file.cid}>
            <div className="card bg-base-100 w-96 shadow-sm" key={file.cid}>
              {file.mime_type?.startsWith("image/") && (
                <>
                  <figure>
                    <img src={`${server}/ipfs/${file.cid}`} alt="Shoes" />
                  </figure>
                  <div className="card-body">
                    <h2 className="card-title">{file.name.replace(/\.jpg$/, "")}</h2>
                    <div className="card-actions justify-end">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          try {
                            await writeYourContractAsync({
                              functionName: "buyImage",
                              args: [file.cid],
                              value: parseEther("0.01"),
                            });
                          } catch (e) {
                            console.error("Error buying image:", e);
                          }
                        }}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;

interface IPFSFile {
  cid: string;
  mime_type?: string;
  name: string;
  size: number;
}
