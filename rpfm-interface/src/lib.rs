#![deny(clippy::all)]

use napi::bindgen_prelude::*;
use napi_derive::napi;

#[macro_use]
extern crate napi_derive;


use std::ffi::OsStr;
use std::path::{PathBuf, Path};
use std::str::FromStr;

use rpfm_lib::packfile::{PackFile, PFHFileType};
use rpfm_lib::packedfile::DecodedPackedFile;
use rpfm_lib::packedfile::text::{TextType};
use rpfm_lib::packedfile::PackedFileType;
use rpfm_lib::SUPPORTED_GAMES;

use std::fs::{File, self};

#[napi]
pub struct Config {
	pub game_selected: String,// = String::From("warhammer3");
}

#[napi]
pub struct PackFileHolder
{
    owned_packfile: PackFile,
}


#[napi]
pub fn open_pack_files(paths: Vec<String>, use_lazy_loading: bool, ignore_mods: bool, lock_packfile: bool) -> PackFileHolder
{
    let mut pathsbufs: Vec<PathBuf> = vec![];

    for path in paths.iter() {
        pathsbufs.push(PathBuf::from(path));
    }

    let mut ret_holder = PackFileHolder { owned_packfile: PackFile::default() };
    match PackFile::open_packfiles(&pathsbufs, use_lazy_loading, ignore_mods, lock_packfile)
    {
        Ok(pack_file) => 
        {
            ret_holder.owned_packfile = pack_file;
        }
        Err(_error) =>
        {
            //nothing
        }
    }

    return ret_holder;
}


#[napi]
pub fn create_packfile_from_folder(packfiles_directory: String, out_mod_path: String, convert_tsv: bool) -> String
{
    let game_selected = SUPPORTED_GAMES.get_supported_game_from_key("warhammer_3").unwrap();

    let mut packfile = PackFile::new_with_name("placeholder", game_selected.get_pfh_version_by_file_type(PFHFileType::Mod));        

    let mut folder_paths: Vec<(PathBuf, Vec<String>)> = Vec::new();
    let mut file_paths: Vec<(PathBuf, Vec<String>)> = Vec::new();
    let dir = fs::read_dir(&packfiles_directory);

    let mut file_paths_strings: Vec<String> = Vec::new();

    match dir {
        Ok(d) => {
            for folder in d {
                let folder = folder.unwrap();
                let path = folder.path();

                let path_string = String::from(path.clone().to_str().unwrap());
                file_paths_strings.push(path_string);

                if path.is_dir() {
                    folder_paths.push((path, vec![]));                    
                }
                else if path.is_file() {
                    let filename: String = String::from(path.file_name().unwrap().to_str().unwrap());
                    file_paths.push((path, Vec::from( [filename] ) ));
                }
            }
        },
        Err(error) => return String::from("Could not get directories from pack director")
    }

    if file_paths.is_empty() && folder_paths.is_empty()
    {
        return String::from("No subfolder found in pack directory");
    }

    let folder_result = packfile.add_from_folders(&folder_paths, &None, true, convert_tsv);
    let file_result = packfile.add_from_files(&file_paths, true);

    if file_result.is_err() && folder_result.is_err() {
        let mut error_string = file_result.unwrap_err().to_string();
        error_string.push_str(&folder_result.unwrap_err().to_string());
        return error_string;
    }

    let buf = PathBuf::from(&out_mod_path);
    match packfile.save(Some(buf))
    {
        Ok(()) => String::from(""),
        Err(err) => return err.to_string(),
    };

    return file_paths_strings.join("-");
}   

// Source file interface
#[napi]
impl PackFileHolder
{
    #[napi]
    pub fn get_all_lua_file_paths(&mut self) -> Vec<String>
    {    
        let mut files_vec = Vec::new();
        let packed_files = self.owned_packfile.get_ref_packed_files_by_type(PackedFileType::Text(TextType::Lua), true);

        packed_files.iter().for_each(|x| files_vec.push(x.get_path().join("/")));

        return files_vec;
    }

    #[napi]
    pub fn get_text_file(&mut self, filepath: String) -> String
    {    
        let splits = filepath.split('/').map(str::to_string).collect::<Vec<String>>();

        match self.owned_packfile.get_packed_file_by_path(&splits) {        
            Some(mut x) => match x.decode_return_ref().unwrap_or(&DecodedPackedFile::Unknown) { 
                DecodedPackedFile::Text(data) => return String::from(data.get_ref_contents()),
                _ => return "Text Not Decoded".to_string()
            },
            None => return "Text Not Found".to_string()
        }
    }
}